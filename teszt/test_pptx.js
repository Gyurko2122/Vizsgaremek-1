const PptxGenJS = require("pptxgenjs");
const pres = new PptxGenJS();
pres.layout = "LAYOUT_WIDE";
pres.author = "Test";
pres.title = "Test";
const slide = pres.addSlide();
slide.addText("Hello", { x: 1, y: 1, fontSize: 32, color: "000000" });
pres.writeFile({ fileName: "test_pptx.pptx" }).then(()=>console.log("ok")).catch(e=>console.error(e));
