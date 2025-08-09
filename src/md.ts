import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';

export type MdCodeBlock = {
    lang: 'js' | 'ts';
    code: string;
    fenceInfo?: string; // raw "info" string if you ever need it
    index: number;
};

export async function extractCodeBlocks(markdown: string): Promise<MdCodeBlock[]> {
    const tree = unified().use(remarkParse).parse(markdown);
    const out: MdCodeBlock[] = [];
    let i = 0;
    console.log(tree.type, tree.children?.map(n => n.type));
    // console.log(tree)
    visit(tree, 'code', (node: any) => {
        console.log(node)
        const lang = (node.lang || '').toLowerCase();
        if (lang === 'js' || lang === 'javascript' || lang === 'ts' || lang === 'typescript') {
            out.push({
                lang: lang.startsWith('t') ? 'ts' : 'js',
                code: node.value as string,
                fenceInfo: node.meta ?? undefined,
                index: ++i,
            });
        }
    });
    return out;
}


/* @skip-prod-transpilation */
if (import.meta.vitest) {
    const { it, expect, describe, vi, beforeEach } = import.meta.vitest

    describe('get code blocks', () => {
        it('javascript code blocks', async () => {
            const md = ["Some code:",
                        "```js",
                        "someCode()",
                        "```",
                        ""].join("\n")
            const blocks = await extractCodeBlocks(md);
            expect(blocks.length).toBe(1);
            expect(blocks[0]).toMatchObject({
                lang: 'js',
                code: 'someCode()\n',
            });
        })

    })
}
