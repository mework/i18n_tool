const log4js = require("log4js");
const path = require("path");

log4js.configure({
  appenders: {
    error: {
      type: "file",
      filename: path.resolve(__dirname, "../logs/error.log"),
    },
    change: {
      type: "file",
      filename: path.resolve(__dirname, "../logs/change.log"),
    },
  },
  categories: {
    default: {
      appenders: ["change"],
      level: "info",
    },
    error: {
      appenders: ["error"],
      level: "error",
    },
  },
});

export const errorLog = log4js.getLogger("error");
export const changeLog = log4js.getLogger("change");
