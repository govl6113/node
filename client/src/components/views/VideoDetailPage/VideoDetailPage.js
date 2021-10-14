import React, { useEffect, useState } from "react";
import { List, Avatar, Row, Col } from "antd";
import axios from "axios";
import SideVideo from "./Sections/SideVideo";
import Subscriber from "./Sections/Subscribe";
import Comments from "./Sections/Comments";
import LikeDislikes from "./Sections/LikeDislikes";

function VideoDetailPage(props) {
  const videoId = props.match.params.videoId;
  const [Video, setVideo] = useState([]);
  const [CommentLists, setCommentLists] = useState([]);

  const videoVariable = {
    videoId: videoId,
  };

  useEffect(() => {
    axios.post("/api/video/getVideo", videoVariable).then((response) => {
      if (response.data.success) {
        console.log(response.data.video);
        setVideo(response.data.video);
      } else {
        alert("Failed to get video Info");
      }
    });

    axios.post("/api/comment/getComments", videoVariable).then((response) => {
      if (response.data.success) {
        console.log("response.data.comments", response.data.comments);
        setCommentLists(response.data.comments);
      } else {
        alert("Failed to get video Info");
      }
    });
  }, []);

  const updateComment = (newComment) => {
    //새로운 Comment저장되면
    setCommentLists(CommentLists.concat(newComment)); //1,2,3 comment에 4번 comment추가될시, Comment state가 1,2,3,4개로
  };

  if (Video.writer) {
    const subscribeButton = Video.writer._id !==
      localStorage.getItem("userId") && (
      <Subscriber
        userTo={Video.writer._id}
        userFrom={localStorage.getItem("userId")}
      />
    ); //user가 본인은 구독할 수 없도록한다.

    return (
      <Row>
        <Col lg={18} xs={24}>
          <div
            className="postPage"
            style={{ width: "100%", padding: "3rem 4em" }}
          >
            <video
              style={{ width: "100%" }}
              src={`http://localhost:5000/${Video.filePath}`}
              controls
            />

            <List.Item
              action={[
                <LikeDislikes
                  video //video쪽인지 comment쪽인지 넘겨줌.
                  videoId={videoId}
                  userId={localStorage.getItem("userId")}
                />,
                subscribeButton,
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar src={Video.writer && Video.writer.image} />}
                title={<a href="https://ant.design">{Video.title}</a>}
                description={Video.description}
              />
            </List.Item>

            <Comments
              CommentLists={CommentLists}
              postId={Video._id}
              refreshFunction={updateComment}
            />
          </div>
        </Col>
        <Col lg={6} xs={24}>
          <SideVideo />
        </Col>
      </Row>
    );
  } else {
    return <div>Loading...</div>;
  }
}

export default VideoDetailPage;
