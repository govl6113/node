const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const videoSchema = mongoose.Schema(
  {
    writer: {
      type: Schema.Types
        .ObjectId /** writer의 id만 넣어도 writer User 모델의 모든 정보를 가져올 수 있음. */,
      ref: "User",
    },
    title: {
      type: String,
      maxlength: 50,
    },
    description: {
      type: String,
    },
    privacy: {
      type: Number,
    },
    filePath: {
      type: String,
    },
    catogory: String,
    views: {
      type: Number,
      default: 0,
    },
    duration: {
      type: String,
    },
    thumbnail: {
      type: String,
    },
  },
  { timestamps: true } /** 생성 date와 update date 표시  */
);

const Video = mongoose.model("Video", videoSchema);

module.exports = { Video };
