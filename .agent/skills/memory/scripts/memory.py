#!/usr/bin/env python3
"""
Memory tool with git-based staleness detection.

Staleness detection: Parses dependencies from docs, compares git timestamps.
- Markdown: Parses "## Depends" section for file list
- Code: Parses "@depends" tag in header comments
- Fallback: Checks code files in same directory

Usage:
    python3 memory.py retrieve <topic>           # Search docs, show freshness
    python3 memory.py validate <doc_path>        # Check if specific doc is stale
    python3 memory.py validate --dir <dir_path>  # Check all docs in directory

Exit codes:
    0 - Success (all docs fresh)
    1 - Stale docs found
    2 - Error occurred
"""

import subprocess
import sys
import re
import math
from dataclasses import dataclass
from pathlib import Path
from datetime import datetime
from typing import Optional

CODE_EXTENSIONS = {'.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java'}
SECONDS_PER_DAY = 86400


@dataclass
class StalenessResult:
    """Result of staleness check with consistent structure."""
    stale: bool
    doc_time: Optional[int] = None
    newest_code_time: Optional[int] = None
    newest_code_file: Optional[str] = None
    days_behind: int = 0
    hours_behind: int = 0
    deps_source: str = 'none'
    deps_count: int = 0
    error: Optional[str] = None
    reason: Optional[str] = None


def get_project_root() -> Path:
    """Get the project root directory (where .git is located)."""
    cwd = Path.cwd()
    for parent in [cwd] + list(cwd.parents):
        if (parent / '.git').exists():
            return parent
    return cwd


def run_git(args: list[str], cwd: str = '.') -> tuple[str, Optional[str]]:
    """
    Run git command and return (output, error_message).

    Returns:
        Tuple of (stdout, error_message). Error is None on success.
    """
    try:
        result = subprocess.run(
            ['git'] + args,
            capture_output=True, text=True, cwd=cwd
        )
        if result.returncode != 0:
            stderr = result.stderr.strip()
            if 'not a git repository' in stderr.lower():
                return '', 'Not a git repository'
            if stderr:
                return '', f'Git error: {stderr}'
            return '', f'Git command failed with code {result.returncode}'
        return result.stdout.strip(), None
    except FileNotFoundError:
        return '', 'Git is not installed or not in PATH'
    except PermissionError as e:
        return '', f'Permission denied running git: {e}'
    except OSError as e:
        return '', f'OS error running git: {e}'


def get_last_commit_time(file_path: str) -> tuple[Optional[int], Optional[str]]:
    """
    Get unix timestamp of last commit that modified this file.

    Returns:
        Tuple of (timestamp, error_message). Timestamp is None if file not in git.
    """
    output, error = run_git(['log', '-1', '--format=%ct', '--', file_path])
    if error:
        return None, error
    if not output:
        return None, None  # File not tracked by git (not an error)
    if output.isdigit():
        return int(output), None
    return None, f'Invalid git timestamp: {output}'


def parse_depends_from_md(file_path: str) -> tuple[list[str], Optional[str]]:
    """
    Parse dependencies from markdown file.

    Looks for:
    - ## Depends section with bullet list of files
    - Inline references like `file.ts:functionName`

    Returns:
        Tuple of (dependencies, error_message).
    """
    try:
        content = Path(file_path).read_text(encoding='utf-8')
    except FileNotFoundError:
        return [], f'File not found: {file_path}'
    except PermissionError:
        return [], f'Permission denied reading: {file_path}'
    except UnicodeDecodeError:
        return [], f'File is not valid UTF-8: {file_path}'
    except OSError as e:
        return [], f'Error reading file: {e}'

    deps = []

    # Parse ## Depends or ### Depends section
    depends_match = re.search(
        r'#{2,3}\s*Depends\s*\n((?:[-*\d.]+\s*`[^`]+`.*\n?)+)',
        content,
        re.IGNORECASE
    )
    if depends_match:
        section = depends_match.group(1)
        # Extract file paths from bullet points: - `./file.ts` or 1. `./file.ts`
        for match in re.finditer(r'[-*\d.]+\s*`([^`]+)`', section):
            deps.append(match.group(1))

    # Parse inline file references: `file.ts:functionName` or `file.ts`
    for match in re.finditer(r'`([^`]+\.(ts|tsx|js|jsx|py|go|rs|java))(?::[^`]+)?`', content):
        file_ref = match.group(1)
        if file_ref not in deps:
            deps.append(file_ref)

    return deps, None


def parse_depends_from_code(file_path: str) -> tuple[list[str], Optional[str]]:
    """
    Parse @depends from code file header comment.

    Looks for: @depends ./file1.ts, ./file2.ts

    Returns:
        Tuple of (dependencies, error_message).
    """
    try:
        content = Path(file_path).read_text(encoding='utf-8')
    except FileNotFoundError:
        return [], f'File not found: {file_path}'
    except PermissionError:
        return [], f'Permission denied reading: {file_path}'
    except UnicodeDecodeError:
        return [], f'File is not valid UTF-8: {file_path}'
    except OSError as e:
        return [], f'Error reading file: {e}'

    deps = []

    # Parse @depends tag
    depends_match = re.search(r'@depends\s+([^\n*]+)', content)
    if depends_match:
        deps_str = depends_match.group(1)
        for dep in deps_str.split(','):
            dep = dep.strip()
            if dep:
                deps.append(dep)

    return deps, None


def resolve_path(base_path: str, relative_path: str, project_root: Path) -> tuple[Optional[str], Optional[str]]:
    """
    Resolve relative path from base file's directory.

    Returns:
        Tuple of (resolved_path, skip_reason). Both None if path doesn't exist.
    """
    # Skip if path is too long or contains suspicious characters
    if len(relative_path) > 200:
        return None, f'Path too long (>200 chars)'
    if '\n' in relative_path:
        return None, 'Path contains newline'

    # Skip paths that look like examples (contain / without ./ or ../ prefix)
    if not relative_path.startswith('./') and not relative_path.startswith('../'):
        if '/' in relative_path:
            return None, f'Use ./ prefix for paths with directories: {relative_path}'

    try:
        base_dir = Path(base_path).parent
        resolved = (base_dir / relative_path).resolve()

        # Security: Ensure resolved path is within project root
        try:
            resolved.relative_to(project_root)
        except ValueError:
            return None, f'Path escapes project directory: {relative_path}'

        if resolved.exists():
            return str(resolved), None

        # Try without ./ prefix
        if relative_path.startswith('./'):
            resolved = (base_dir / relative_path[2:]).resolve()
            try:
                resolved.relative_to(project_root)
            except ValueError:
                return None, f'Path escapes project directory: {relative_path}'
            if resolved.exists():
                return str(resolved), None

        return None, None  # Path doesn't exist (not an error, just skip)

    except (OSError, ValueError) as e:
        return None, f'Error resolving path: {e}'


def get_code_files_in_dir(dir_path: str) -> tuple[list[str], Optional[str]]:
    """
    Get all code files in directory (non-recursive).

    Returns:
        Tuple of (file_list, error_message).
    """
    path = Path(dir_path)
    try:
        if not path.is_dir():
            return [], None  # Not a directory, not an error
        files = [
            str(f) for f in path.iterdir()
            if f.is_file() and f.suffix in CODE_EXTENSIONS
        ]
        return files, None
    except PermissionError:
        return [], f'Permission denied reading directory: {dir_path}'
    except OSError as e:
        return [], f'Error reading directory: {e}'


def check_staleness(doc_path: str, project_root: Path) -> StalenessResult:
    """
    Check if a doc is potentially stale.

    Strategy:
    1. Parse explicit dependencies from doc (@depends or ## Depends)
    2. Parse inline file references
    3. Fallback: check code files in same directory
    """
    doc_time, git_error = get_last_commit_time(doc_path)

    if git_error:
        return StalenessResult(stale=False, error=git_error)

    if doc_time is None:
        return StalenessResult(stale=False, error='Doc not tracked by git')

    # Get dependencies based on file type
    if doc_path.endswith('.md'):
        deps, parse_error = parse_depends_from_md(doc_path)
    else:
        deps, parse_error = parse_depends_from_code(doc_path)

    if parse_error:
        return StalenessResult(
            stale=False,
            doc_time=doc_time,
            error=parse_error,
            deps_source='none'
        )

    # Resolve relative paths to absolute
    resolved_deps = []
    for dep in deps:
        resolved, skip_reason = resolve_path(doc_path, dep, project_root)
        if resolved:
            resolved_deps.append(resolved)
        # Skip reasons are informational, not errors

    deps_source = 'explicit' if resolved_deps else 'directory'

    # Fallback: use code files in same directory
    if not resolved_deps:
        dir_path = str(Path(doc_path).parent)
        resolved_deps, dir_error = get_code_files_in_dir(dir_path)
        if dir_error:
            return StalenessResult(
                stale=False,
                doc_time=doc_time,
                deps_source='directory',
                error=dir_error
            )

    if not resolved_deps:
        return StalenessResult(
            stale=False,
            doc_time=doc_time,
            deps_source=deps_source,
            reason='No dependencies found'
        )

    # Find newest dependency
    newest_time = 0
    newest_file = None
    checked_deps = []

    for dep_path in resolved_deps:
        dep_time, _ = get_last_commit_time(dep_path)
        if dep_time:
            checked_deps.append({'path': dep_path, 'time': dep_time})
            if dep_time > newest_time:
                newest_time = dep_time
                newest_file = dep_path

    if newest_time == 0:
        return StalenessResult(
            stale=False,
            doc_time=doc_time,
            deps_source=deps_source,
            deps_count=len(resolved_deps),
            reason='Dependencies not tracked by git'
        )

    is_stale = newest_time > doc_time
    time_diff = newest_time - doc_time if is_stale else 0
    days_behind = time_diff // SECONDS_PER_DAY
    hours_behind = (time_diff % SECONDS_PER_DAY) // 3600

    return StalenessResult(
        stale=is_stale,
        doc_time=doc_time,
        newest_code_time=newest_time,
        newest_code_file=newest_file,
        days_behind=days_behind,
        hours_behind=hours_behind,
        deps_source=deps_source,
        deps_count=len(checked_deps)
    )


def format_time(timestamp: int) -> str:
    """Format unix timestamp as human-readable date."""
    try:
        return datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d')
    except (OSError, OverflowError, ValueError):
        return f'Invalid({timestamp})'


def format_time_behind(days: int, hours: int) -> str:
    """Format time behind as human-readable string."""
    if days > 0:
        return f'{days}d'
    elif hours > 0:
        return f'{hours}h'
    else:
        return '<1h'


def cmd_retrieve(topic: str) -> int:
    """
    Search for docs about a topic, show freshness status.

    Returns exit code: 0=success, 2=error
    """
    print(f"Searching docs for: {topic}\n")

    try:
        # Use -e to prevent topic from being interpreted as a flag
        result = subprocess.run(
            ['grep', '-ri', '--include=*.md', '-l', '-e', topic, '.'],
            capture_output=True, text=True
        )
    except FileNotFoundError:
        print("Error: 'grep' command not found. Please install grep.")
        return 2
    except PermissionError:
        print("Error: Permission denied executing grep.")
        return 2
    except OSError as e:
        print(f"Error running grep: {e}")
        return 2

    # Exit code 2 = grep error (not just "no matches")
    if result.returncode == 2:
        print(f"Error: grep failed: {result.stderr.strip()}")
        return 2

    if not result.stdout.strip():
        print("No docs found.")
        return 0

    doc_files = result.stdout.strip().split('\n')
    # Filter out node_modules
    doc_files = [f for f in doc_files if 'node_modules' not in f]

    if not doc_files:
        print("No docs found (excluding node_modules).")
        return 0

    project_root = get_project_root()

    print(f"Found {len(doc_files)} doc(s):\n")
    print(f"{'Status':<14} {'Source':<10} {'Updated':<12} {'Path'}")
    print("-" * 75)

    for doc_path in doc_files[:20]:
        result = check_staleness(doc_path, project_root)

        if result.error:
            status = "? Error"
            source = "-"
            date = "N/A"
        elif result.stale:
            time_str = format_time_behind(result.days_behind, result.hours_behind)
            status = f"⚠ STALE({time_str})"
            source = result.deps_source
            date = format_time(result.doc_time) if result.doc_time else "N/A"
        else:
            status = "✓ Fresh"
            source = result.deps_source
            date = format_time(result.doc_time) if result.doc_time else "N/A"

        print(f"{status:<14} {source:<10} {date:<12} {doc_path}")

    if len(doc_files) > 20:
        print(f"\n... and {len(doc_files) - 20} more docs")

    print("\nSource: 'explicit' = parsed from doc, 'directory' = checked same dir")
    print("⚠ STALE = dependencies changed after doc was updated")
    return 0


def cmd_validate(path: str, is_dir: bool = False) -> int:
    """
    Validate freshness of a doc or all docs in directory.

    Returns exit code: 0=fresh, 1=stale found, 2=error
    """
    project_root = get_project_root()

    if is_dir:
        dir_path = Path(path)
        if not dir_path.is_dir():
            print(f"Error: {path} is not a directory")
            return 2

        try:
            docs = [d for d in dir_path.rglob('*.md') if 'node_modules' not in str(d)]
        except PermissionError:
            print(f"Error: Permission denied accessing {path}")
            return 2
        except OSError as e:
            print(f"Error: {e}")
            return 2

        if not docs:
            print("No markdown files found.")
            return 0

        print(f"Checking {len(docs)} doc(s) in {path}:\n")
        stale_count = 0
        error_count = 0

        for doc in docs:
            result = check_staleness(str(doc), project_root)

            if result.error:
                error_count += 1
                print(f"? ERROR: {doc}")
                print(f"   {result.error}\n")
            elif result.stale:
                stale_count += 1
                time_str = format_time_behind(result.days_behind, result.hours_behind)

                print(f"⚠ STALE: {doc}")
                print(f"   Doc updated:  {format_time(result.doc_time)}")
                print(f"   Code updated: {format_time(result.newest_code_time)} ({Path(result.newest_code_file).name})")
                print(f"   Detection:    {result.deps_source} ({result.deps_count} deps checked)")
                print(f"   Time behind:  {time_str}\n")

        if error_count > 0:
            print(f"Errors: {error_count} doc(s) could not be checked")

        if stale_count == 0 and error_count == 0:
            print("✓ All docs are fresh!")
            return 0
        elif stale_count > 0:
            print(f"\nSummary: {stale_count}/{len(docs)} doc(s) potentially stale")
            return 1
        else:
            return 2
    else:
        if not Path(path).is_file():
            print(f"Error: {path} is not a file")
            return 2

        result = check_staleness(path, project_root)

        if result.error:
            print(f"Error: {result.error}")
            return 2
        elif result.stale:
            time_str = format_time_behind(result.days_behind, result.hours_behind)

            print(f"⚠ STALE: {path}")
            print(f"   Doc updated:  {format_time(result.doc_time)}")
            print(f"   Code updated: {format_time(result.newest_code_time)}")
            print(f"   Changed file: {result.newest_code_file}")
            print(f"   Detection:    {result.deps_source} ({result.deps_count} deps checked)")
            print(f"   Time behind:  {time_str}")
            print("\n→ Consider updating this doc to reflect recent code changes")
            return 1
        else:
            print(f"✓ Fresh: {path}")
            if result.doc_time:
                print(f"   Last updated: {format_time(result.doc_time)}")
            print(f"   Detection: {result.deps_source}")
            if result.reason:
                print(f"   Note: {result.reason}")
            return 0


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)

    cmd = sys.argv[1]

    if cmd == 'retrieve':
        if len(sys.argv) < 3:
            print("Usage: memory.py retrieve <topic>")
            sys.exit(2)
        exit_code = cmd_retrieve(sys.argv[2])
        sys.exit(exit_code)

    elif cmd == 'validate':
        if len(sys.argv) < 3:
            print("Usage: memory.py validate <doc_path>")
            print("       memory.py validate --dir <dir_path>")
            sys.exit(2)

        if sys.argv[2] == '--dir':
            if len(sys.argv) < 4:
                print("Usage: memory.py validate --dir <dir_path>")
                sys.exit(2)
            exit_code = cmd_validate(sys.argv[3], is_dir=True)
        else:
            exit_code = cmd_validate(sys.argv[2])
        sys.exit(exit_code)

    elif cmd in ['-h', '--help', 'help']:
        print(__doc__)
        sys.exit(0)

    else:
        print(f"Unknown command: {cmd}")
        print(__doc__)
        sys.exit(2)


if __name__ == '__main__':
    main()
