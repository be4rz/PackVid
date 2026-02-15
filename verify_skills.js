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

        const frontMatter = lines.slice(1, frontMatterEndIndex).join('\n');

        // Simple parsing
        const hasName = /name:\s*.+/.test(frontMatter);
        const hasDesc = /description:\s*.+/.test(frontMatter);
        const nameMatch = frontMatter.match(/name:\s*(.+)/);
        const nameValue = nameMatch ? nameMatch[1].trim() : '';

        if (!hasName) {
            console.error(`[FAIL] ${skillName}: Missing 'name' in frontmatter`);
            hasErrors = true;
        } else if (nameValue !== skillName) {
            console.error(`[WARN] ${skillName}: Name in frontmatter ('${nameValue}') does not match directory name ('${skillName}')`);
            // Not a critical failure, but worth noting
        }

        if (!hasDesc) {
            console.error(`[FAIL] ${skillName}: Missing 'description' in frontmatter`);
            hasErrors = true;
        }

        if (hasName && hasDesc) {
            console.log(`[PASS] ${skillName}`);
        }
    });

    console.log('--- End Report ---');
    if (hasErrors) process.exit(1);
}

checkSkills();
