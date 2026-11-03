// Used by every Vocabulary/<Media>/<Media>.md page. Usage: await dv.view("Views/media-page");
const folder = dv.current()?.file?.folder;
if (!folder) throw new Error("media-page: cannot find the current page's folder");

// Words in this media's folder, subfolders included.
// The boundary check keeps "Dragon Ball" from matching "Dragon Ball Z".
const inFolder = p => p.file.folder === folder || p.file.folder.startsWith(folder + "/");
const words = dv.pages('"Vocabulary"').where(p => p.media && inFolder(p)).array();

await dv.view("Views/vocab-explorer", { words, key: folder });
