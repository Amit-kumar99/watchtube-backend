const extractPublicIdFromUrl = (url) => {
  const regex = /\/v\d+\/([^#?\/.]+)/;
  const match = url.match(regex);
  if (match && match.length > 1) {
    return match[1];
  } else {
    return null;
  }
};

const extractResourceType = (url) => {
  if (url.includes("image")) {
    return "image";
  } else if (url.includes("video")) {
    return "video";
  } else {
    return null;
  }
};

module.exports = {
  extractPublicIdFromUrl,
  extractResourceType,
};
