onUiLoaded(function () {
    function isScenarioTreePromptTextarea(target) {
        if (!target || target.tagName !== "TEXTAREA") {
            return false;
        }
        let node = target;
        while (node) {
            if (node.id && node.id.endsWith("_prompt_txt")) {
                return true;
            }
            node = node.parentElement;
        }
        return false;
    }

    function transformSelectedLines(textarea, mode) {
        const value = textarea.value || "";
        const selStart = textarea.selectionStart;
        const selEnd = textarea.selectionEnd;

        const blockStart = value.lastIndexOf("\n", Math.max(0, selStart - 1)) + 1;
        let nextNewline = value.indexOf("\n", selEnd);
        if (nextNewline === -1) {
            nextNewline = value.length;
        }

        const before = value.slice(0, blockStart);
        const selectedBlock = value.slice(blockStart, nextNewline);
        const after = value.slice(nextNewline);

        const lines = selectedBlock.split("\n");
        const transformed = lines.map((line) => {
            if (mode === "indent") {
                return "#" + line;
            }
            if (line.startsWith("#")) {
                return line.slice(1);
            }
            return line;
        }).join("\n");

        const updated = before + transformed + after;
        if (updated !== value) {
            textarea.value = updated;
            textarea.selectionStart = blockStart;
            textarea.selectionEnd = blockStart + transformed.length;
            textarea.dispatchEvent(new Event("input", { bubbles: true }));
        }
    }

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Tab") {
            return;
        }
        const target = event.target;
        if (!isScenarioTreePromptTextarea(target)) {
            return;
        }
        event.preventDefault();
        transformSelectedLines(target, event.shiftKey ? "outdent" : "indent");
    }, true);
});