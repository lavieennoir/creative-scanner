const fs = require("fs");
const axios = require("axios");
const URL = require("url").URL;

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
};

// Read comand line arguments
function getInputArgs() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error(
      '"Input file name" and "Output file name" arguments must be specified'
    );
    process.exit(1);
  }
  return args;
}

// Read input file content
function readFile(fileName) {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, "utf8", function (err, content) {
      if (err) {
        return reject(err.message);
      }
      resolve(content);
    });
  });
}

// Find creative image URL
function getCreativeImageUrl(content) {
  // To get image URL we should find src attribute of <img/>
  // tag placed inside of <script type="text/adtag"> tag
  const startingFeature = new RegExp(
    '<script\\stype="text/adtag">((?!<img).)*<img((?!src=").)*src="'
  );
  const contentParts = content.split(startingFeature);
  // The last item in contentParts will start with creative image url
  // Find the end of src attribute to get full url
  const creativeImageUrl = contentParts[contentParts.length - 1].split('"')[0];
  return creativeImageUrl;
}

function getImageStream(url) {
  if (!isValidUrl(url)) {
    console.error("Can't find creative image URL. Please check input file.");
    process.exit(2);
  }
  console.log("Downloading creative image...");

  return axios({
    method: "get",
    url: url,
    responseType: "stream",
  })
    .then((res) => res.data)
    .catch((e) => {
      console.error(e.message);
      process.exit(3);
    });
}

function saveImage(imageStream, outputFileName) {
  imageStream.pipe(fs.createWriteStream(outputFileName));
  console.log(`Done. Image saved to ${outputFileName}`);
}

const [inputFileName, outputFileName] = getInputArgs();

readFile(inputFileName)
  .then((content) => getCreativeImageUrl(content))
  .then((url) => getImageStream(url))
  .then((imageStream) => saveImage(imageStream, outputFileName))
  .catch((e) => console.error(e));
