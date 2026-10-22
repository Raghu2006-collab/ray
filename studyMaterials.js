
const files = import.meta.glob("../components/**/*.{pdf,ppt,pptx}", {
  eager: true,
  query: "?url",
  import: "default",
});

export const studyMaterials = Object.entries(files).map(
  ([path, url], index) => {
    const filename = path.split("/").pop();
    const extension = filename.split(".").pop().toLowerCase();

    return {
      id: `${index}-${filename}`,
      filename,
      title: filename
        .replace(/\.(pdf|pptx?)$/i, "")
        .replace(/[_-]+/g, " "),
      extension,
      type: extension === "pdf" ? "PDF" : "PowerPoint",
      url,
    };
  }
);
