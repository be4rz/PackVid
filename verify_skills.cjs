const fs = require('fs');
const path = require('path');

const skillsDir = '/Users/chantran/Desktop/PackVid/.claude/skills';

function checkSkills() {
    if (!fs.existsSync(skillsDir)) {
        console.error(`Skills directory not found: ${skillsDir}`);
        return;
    }

    const items = fs.readdirSync(skillsDir, { withFileTypes: true });

    console.log('--- Skill Verification Report ---');
    let hasErrors = false;

    // Check if items are actually directories and contain SKILL.md

    items.forEach(item => {
        if (!item.isDirectory()) return;

        const skillName = item.name;
        const skillPath = path.join(skillsDir, skillName);
        const skillFile = path.join(skillPath, 'SKILL.md');

        if (!fs.existsSync(skillFile)) {
            console.error(`[FAIL] ${skillName}: SKILL.md missing`);
            hasErrors = true;
            return;
        }

        const content = fs.readFileSync(skillFile, 'utf8');
        const lines = content.split('\n');

        if (lines[0].trim() !== '---') {
            console.error(`[FAIL] ${skillName}: SKILL.md does not start with YAML frontmatter (---)`);
            hasErrors = true;
            return;
        }

        let frontMatterEndIndex = -1;
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '---') {
                frontMatterEndIndex = i;
                break;
            }
        }

        if (frontMatterEndIndex === -1) {
            console.error(`[FAIL] ${skillName}: SKILL.md frontmatter not closed`);
            hasErrors = true;
            return;
        }

        const frontMatterLines = lines.slice(1, frontMatterEndIndex);
        const frontMatter = frontMatterLines.join('\n');

        // Simple parsing
        const hasName = /name:\s*.+/.test(frontMatter);
        const hasDesc = /description:\s*.+/.test(frontMatter);

        // Extract name value to compare with directory
        const nameMatch = frontMatter.match(/name:\s*(.+)/);
        const nameValue = nameMatch ? nameMatch[1].trim() : '';
        const cleanNameValue = nameValue.replace(/['"]/g, ''); // remove quotes if any

        if (!hasName) {
            console.error(`[FAIL] ${skillName}: Missing 'name' in frontmatter`);
            hasErrors = true;
        } else if (cleanNameValue !== skillName) {
            console.warn(`[WARN] ${skillName}: Name in frontmatter ('${cleanNameValue}') does not match directory name ('${skillName}')`);
            // This is a warning, not a hard fail for "format", but worth consistency check
        }

        if (!hasDesc) {
            console.error(`[FAIL] ${skillName}: Missing 'description' in frontmatter`);
            hasErrors = true;
        }

        // Check for required sections only if name and desc are present
        if (hasName && hasDesc) {
            console.log(`[PASS] ${skillName}`);
        }
    });

    console.log('--- End Report ---');
    // We exit with 0 even if errors, so we can see the output. 
    // If I exit with 1, run_command might just show "Exit code 1" without output depending on tool behavior (though usually it shows output).
    // I'll exit 0 and rely on the text output.
}

checkSkills();
