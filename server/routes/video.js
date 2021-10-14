const express = require("express");
const router = express.Router();
const { Video } = require("../models/Video");

const { auth } = require("../middleware/auth");
const multer = require("multer");
var ffmpeg = require("fluent-ffmpeg");

//=================================
//             Video
//=================================
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    /**파일 저장되는 곳 : /upload */
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${Date.now()}_${file.originalname}`
    ); /**저장되는 파일 명 : 20211005_hello */
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== ".mp4") {
      /**파일형식은 mp4(동영상)만 가능 */
      return cb(res.status(400).end("only mp4 is allowed"), false);
    }
    cb(null, true);
  },
});

var upload = multer({ storage: storage }).single("file"); //파일 옵션은 우리가 만든 storage, single파일만 가능

/** 파일 저장 */
router.post("/uploadfiles", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.json({
        success: false,
        err,
      }); /** client에 success false, err메세지 보냄 */
    }
    return res.json({
      /** client에 날릴 정보들  */ success: true,
      filePath: res.req.file.path,
      fileName: res.req.file.filename,
    });
  });
});

router.post("/thumbnail", (req, res) => {
  let thumbsFilePath = "";
  let fileDuration = "";

  /** 비디오 정보 가져오기 */
  ffmpeg.ffprobe(req.body.filePath, function (err, metadata) {
    console.dir(metadata);
    console.log(metadata.format.duration);

    fileDuration = metadata.format.duration;
  });

  ffmpeg(req.body.filePath) /** client가 요청한 파일의 경로 : /upload */
    /** 썸네일 파일 이름 생성 */
    .on("filenames", function (filenames) {
      console.log("Will generate " + filenames.join(", "));
      thumbsFilePath = "uploads/thumbnails/" + filenames[0];
    })
    .on("end", function () {
      console.log("Screenshots taken"); /** 썸네일 생성 끝나면 */
      return res.json({
        success: true,
        thumbsFilePath: thumbsFilePath,
        fileDuration: fileDuration,
      });
    })
    .screenshots({
      // Will take screens at 20%, 40%, 60% and 80% of the video
      /** 썸네일은 3개까지 가능, uploads/thumbnails 폴더에 썸네일사진 저장될 것이다.  */
      count: 3,
      folder: "uploads/thumbnails",
      size: "320x240",
      // %b input basename ( filename w/o extension )
      filename: "thumbnail-%b.png",
    });
});

/** 비디오 정보 저장 */
router.post("/uploadVideo", (req, res) => {
  const video = new Video(req.body); /** client가 보낸 정보들 저장 */

  video.save((err, video) => {
    /** mongo DB 메소드 save로 DB에 저장 */
    if (err) return res.status(400).json({ success: false, err });
    return res.status(200).json({
      success: true,
    });
  });
});

/** 비디오 전체를 DB에서 가져와서 클라이언트에 보낸다 */
router.get("/getVideos", (req, res) => {
  Video.find() // Video 모든 객체를 가져옴
    .populate("writer")
    .exec((err, videos) => {
      if (err) return res.status(400).send(err);
      res.status(200).json({ success: true, videos });
    });
});

/** 비디오 하나를 DB에서 가져와서 클라이언트에 보낸다 */
router.post("/getVideo", (req, res) => {
  Video.findOne({
    _id: req.body.videoId,
  }) // 클라이언트에서 찾은 video Id로 DB에서 video를 찾는다.
    .populate("writer") // writer정보가 id만 들어있기 때문에 populate로 writer정보 전체를 들고온다
    .exec((err, video) => {
      if (err) return res.status(400).send(err);
      res.status(200).json({ success: true, video });
    });
});

router.post("/getSubscriptionVideos", (req, res) => {
  // 자신의 아이디를 가지고 구독하는 사람들을 찾는다.

  Subscriber.find({ userFrom: req.body.userFrom }).exec((err, subscribers) => {
    if (err) return res.status(400).send(err);

    let subscribedUser = [];

    subscribers.map((subscriber, i) => {
      subscribedUser.push(subscriber.userTo);
    });

    // 찾은 사람들의 비디오를 가지고 온다.
    Video.find({ writer: { $in: subscribedUser } }) //$in은 subscribedUser 속에 User가 3,4명일 수도 있기때문
      .populate("writer") //writer의 정보는 id밖에 없어서 populate로 writer의 name, email등 다 들고옴
      .exec((err, videos) => {
        if (err) return res.status(400).send(err);
        res.status(200).json({ success: true, videos });
      });
  });
});

module.exports = router;

// 연습
/** 비디오 전체를 DB에서 가져와서 클라이언트에 보낸다 
router.get("/getVideos", async (req, res) => {
  try {
    const videos = await Video.find().populate("writer");
    res.json(videos);
  } catch (err) {
    res.json({ message: err });
  }
});

//dynamic route
router.get("/:postId", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    res.json(post);
  } catch (err) {
    res.json({ message: err });
  }
});

//delete post
router.delete("/:postId", async (req, res) => {
  try {
    const deletePost = await Post.remove({ _id: req.params.postId });
    res.json(deletePost);
  } catch (err) {
    res.json({ message: err });
  }
});

//update post
router.patch("/:postId", async (req, res) => {
  try {
    const updatedPost = await Post.updateOne(
      { _id: req.params.postId },
      { $set: { title: req.body.title } }
    );
    res.json(updatedPost);
  } catch (err) {
    res.json({ message: err });
  }
});
//delete post
router.delete("/:postId", async (req, res) => {
  try {
    const deletePost = await Post.remove({ _id: req.params.postId });
  } catch (err) {
    res.json({ message: err });
  }
});
*/
