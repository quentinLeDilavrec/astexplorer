const localRequire = require.context('./', true, /^\.\/(?!utils|transpilers)[^/]+\/((transformers|differs)\/([^/]+)\/)?(codeExample\.txt|codeExample_old\.txt|[^/]+?\.js)$/);

const files =
  localRequire.keys()
    .map(name => name.split('/').slice(1));

const categoryByID = {};
const parserByID = {};
const transformerByID = {};
const differByID = {};

const restrictedParserNames = new Set([
  'index.js',
  'codeExample.txt',
  'codeExample_old.txt',
  'transformers',
  'differs',
  'utils',
]);

export const categories =
  files
    .filter(name => name[1] === 'index.js')
    .map(([catName]) => {
      let category = localRequire(`./${catName}/index.js`);

      categoryByID[category.id] = category;

      category.codeExample = localRequire(`./${catName}/codeExample.txt`);

      let catFiles =
        files
          .filter(([curCatName]) => curCatName === catName)
          .map(name => name.slice(1));

      category.parsers =
        catFiles
          .filter(([parserName]) => !restrictedParserNames.has(parserName))
          .map(([parserName]) => {
            let parser = localRequire(`./${catName}/${parserName}`);
            parser = parser.__esModule ? parser.default : parser;
            parserByID[parser.id] = parser;
            parser.category = category;
            return parser;
          });

      category.transformers =
        catFiles
          .filter(([dirName, , fileName]) => dirName === 'transformers' && fileName === 'index.js')
          .map(([, transformerName]) => {
            let transformerDir = `./${catName}/transformers/${transformerName}`;
            let transformer = localRequire(`${transformerDir}/index.js`);
            transformer = transformer.__esModule ? transformer.default : transformer;
            transformerByID[transformer.id] = transformer;
            transformer.defaultTransform = localRequire(`${transformerDir}/codeExample.txt`);
            return transformer;
          });

      category.differs =
        catFiles
          .filter(([dirName, , fileName]) => dirName === 'differs' && fileName === 'index.js')
          .map(([, differName]) => {
            let differDir = `./${catName}/differs/${differName}`;
            let differ = localRequire(`${differDir}/index.js`);
            differ = differ.__esModule ? differ.default : differ;
            differByID[differ.id] = differ;
            differ.defaultOld = localRequire(`${differDir}/codeExample_old.txt`);
            return differ;
          });
      if (catName === "java")
        console.log(1, catName, catFiles, category)

      return category;
    });

export function getDefaultCategory() {
  return categoryByID.javascript;
}

export function getDefaultParser(category = getDefaultCategory()) {
  return category.parsers.filter(p => p.showInMenu)[0];
}

export function getCategoryByID(id) {
  return categoryByID[id];
}

export function getParserByID(id) {
  return parserByID[id];
}

export function getTransformerByID(id) {
  return transformerByID[id];
}

export function getDifferByID(id) {
  return differByID[id];
}
