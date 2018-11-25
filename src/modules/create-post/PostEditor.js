import React, {
  Component,
  useState,
  useContext,
  useCallback,
  useRef,
  useEffect,
  useMemo
} from "react";
import {
  Header,
  Container,
  Segment,
  Label,
  Loader,
  Modal,
  Divider,
  Popup,
  Visibility,
  Icon as SemIcon,
  Button,
  Message,
  Card,
  Input
} from "semantic-ui-react";
import { Query } from "react-apollo";
import { contents, MODES } from "./../../components/widgets";
import AntButton from "antd/lib/button";
import {
  LAST_DRAFT,
  PUBLISH_POST,
  UPDATE_POST_WIDGETS
} from "../../gql-schemas";
import CreatePostContext from "../../contexts/CreatePost";
import ErrorContext from "../../contexts/ErrorContext";
import Responsive from "../../contexts/Responsive";
import PostWidgetContext from "../../contexts/PostWidgetContext";
import LayoutContext from "./../../contexts/LayoutContext";
import get from "lodash/get";
import last from "lodash/last";
import debounce from "lodash/debounce";
import Icon from "antd/lib/icon";
import ContentDropdown from "./ContentDropdown";
import ContentEditor from "./ContentEditor";
import { navigate } from "@reach/router";

import "./create-post.css";
import { useOnUnmount } from "react-hanger";
import PostItem from "../post-item";

function ContentActions({ contentData }) {
  const { _refNo, code, postRefNo } = contentData;
  const context = useContext(PostWidgetContext.Context);
  const error = useContext(ErrorContext.Context);
  const btnProps = {
    size: "mini",
    disabled: context.submitting
  };

  return (
    <div
      className="content-actions"
      onClick={e => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <Button icon="arrows alternate" {...btnProps} />
      <Button
        icon="trash"
        {...btnProps}
        onClick={async () => {
          error.clear(UPDATE_POST_WIDGETS.key);
          await context.submitWidgetsFn([
            {
              __deleted: true,
              _refNo,
              code,
              postRefNo
            }
          ]);
        }}
      />
    </div>
  );
}

function ContentBlock(props) {
  const {
    mobile,
    contentKey,
    active,
    onClick,
    onDelete,
    onClose,
    defaultValues,
    onUpdated,
    postRefNo,
    _refNo,
    index
  } = props;
  const Content = contents[contentKey].component;
  const style = { paddingLeft: 15, paddingRight: 15, margin: 0 };
  if (!active) {
    style.cursor = "pointer";
  }
  return (
    <Segment
      basic
      onClick={onClick}
      style={style}
      className={active ? "content-active" : "content-inactive"}
    >
      {active && <ContentActions {...props} />}
      <Content mode={MODES.VIEW} defaultValues={defaultValues} basic fitted />
    </Segment>
  );
}

const TitleEditor = React.memo(({ title, refNo }) => {
  const { editPost } = useContext(CreatePostContext.Context);
  const error = useContext(ErrorContext.Context);
  console.log("render title");

  return (
    <Input
      key={refNo}
      size="big"
      fluid
      defaultValue={title}
      label={{ basic: true, content: "Title" }}
      placeholder="What is this about?"
      onChange={debounce((_, { value }) => {
        error.clear(PUBLISH_POST.key);
        editPost({ _refNo: refNo, title: value });
      }, 1000)}
    />
  );
});

const ContentList = React.memo(({ post }) => {
  const { isMobile } = useContext(Responsive.Context);
  const {
    currentContent,
    defaultContentCode,
    setCurrentContent,
    submitWidgetsFn,
    submitting
  } = useContext(PostWidgetContext.Context);

  // const selectedContent = post.widgets.find(widget => {
  //   return widget._refNo === get(currentContent, "_refNo");
  // });

  // useEffect(
  //   () => {
  //     if (!currentContent) {
  //       console.log("need select");
  //       const lastWidget = last(post.widgets);
  //       if (!lastWidget) {
  //       } else {
  //         console.log("setting last current", lastWidget);
  //         setCurrentContent(lastWidget);
  //       }
  //     }
  //   },
  //   [post]
  // );

  // useEffect(
  //   () => {
  //     if (selectedContent) {
  //       setCurrentContent(selectedContent);
  //       return;
  //     }

  //     const lastWidget = last(post.widgets);
  //     console.log("setting last widget");
  //     setCurrentContent(lastWidget);
  //   },
  //   [selectedContent]
  // );

  const contents = post.widgets || [];

  return (
    <>
      {contents.map((content, ii) => (
        <ContentBlock
          mobile={isMobile}
          key={ii}
          index={ii}
          _refNo={content._refNo}
          postRefNo={post._refNo}
          contentKey={content.code}
          defaultValues={content.values}
          contentData={content}
          active={get(currentContent, "_refNo") === content._refNo}
          onUpdated={values => {}}
          // onClose={() => setActiveIndex(null)}
          onClick={() => setCurrentContent(content)}
        />
      ))}
    </>
  );
});

function ContentSelector({ post }) {
  const [selectedKey, setSelectedKey] = useState(null);
  const {
    currentContent,
    setCurrentContent,
    submitWidgetsFn,
    defaultContentCode
  } = useContext(PostWidgetContext.Context);

  async function createNewContent() {
    const newAdded = await submitWidgetsFn(
      [
        {
          code: selectedKey,
          postRefNo: post._refNo,
          values: {}
        }
      ],
      { newWidget: true }
    );
    setCurrentContent(get(newAdded, "0"));
  }

  useEffect(
    () => {
      if (!selectedKey) return;
      createNewContent();
    },
    [selectedKey]
  );

  return (
    <>
      <Segment basic color="olive" inverted>
        Available Contents
      </Segment>
      <Segment basic className="content-selector">
        <Card.Group stackable itemsPerRow={3}>
          {Object.keys(contents).map(cKey => {
            const contentData = contents[cKey];
            return (
              <Card
                key={cKey}
                onClick={() => {
                  if (selectedKey) return;
                  setSelectedKey(cKey);
                }}
              >
                <Card.Content>
                  <Card.Header>
                    <Icon {...contentData.icon} />
                    {"  "}
                    {contentData.name}
                  </Card.Header>
                  <Card.Meta>{cKey}</Card.Meta>
                  {/* <Card.Description>
          Steve wants to add you to the group{" "}
          <strong>best friends</strong>
        </Card.Description> */}
                </Card.Content>
              </Card>
            );
          })}
        </Card.Group>
      </Segment>
    </>
  );
}

function PostActions({ post, onSubmit, onCancel }) {
  const { isMobile } = useContext(Responsive.Context);
  const {
    currentContent,
    setCurrentContent,
    defaultContentCode,
    submitting: updating,
    contentKeys,
    submitWidgetsFn
  } = useContext(PostWidgetContext.Context);

  const [showSelector, setShowSelector] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(
    () => {
      setShowSelector(false);
    },
    [currentContent]
  );

  if (currentContent) return null;

  console.log("contents", contents); //TRACE

  return (
    <>
      <Segment
        basic
        className="add-content"
        style={{ padding: 10, borderTop: "solid 1px gainsboro" }}
      >
        <AntButton
          icon={showSelector ? "minus-circle" : "plus"}
          size="large"
          type="dashed"
          loading={updating}
          onClick={() => {
            setShowSelector(!showSelector);
          }}
        >
          {isMobile
            ? showSelector
              ? `Close`
              : `Add`
            : showSelector
            ? `Close Selector`
            : `Add Content`}
        </AntButton>
        <Button
          size="large"
          icon="send"
          floated="right"
          primary
          loading={submitting}
          disabled={submitting || get(post, "widgets", []).length === 0}
          content="Post"
          onClick={async () => {
            if (submitting) return;
            setSubmitting(true);
            try {
              onSubmit && (await onSubmit(post));
            } finally {
              setSubmitting(false);
            }
          }}
        />
        <Button
          size="large"
          icon="cancel"
          floated="right"
          content={isMobile ? null : "Cancel"}
          basic
          onClick={() => {
            onCancel && onCancel();
          }}
        />
      </Segment>
      {showSelector && <ContentSelector post={post} />}
    </>
  );
}

function ContentEditorWrapper({ post, contentEditorSize, inline }) {
  const [state, setState] = useState({
    height: 0,
    lastUpdate: Date.now()
  });
  const sizeChanged = useCallback(calculations => {
    const curTime = Date.now();
    if (curTime - state.lastUpdate > 1000)
      setState({
        height: calculations.height,
        lastUpdate: curTime
      });
  });
  return (
    <ContentEditor
      post={post}
      size={contentEditorSize}
      onSizeChanged={sizeChanged}
    />
  );
}

function ParentPost({ refNo }) {
  return null;
}

function PostHeader({ post }) {
  console.log("postPheader", post); //TRACE
  const hasParent = !!post.parentPost;
  return hasParent ? (
    <>
      <Segment color="teal" className="reply-parent-post" basic secondary>
        <Label as="a" color="teal" ribbon>
          <SemIcon name="comment alternate" />
          Post
        </Label>
        <Segment className="reply-parent-post-item" raised>
          <PostItem
            isCompact
            post={post.parentPost}
            basic
            withLabels={false}
            withActions={false}
          />
        </Segment>
      </Segment>
      <Segment inverted color="teal" className="new-reply-header">
        Reply
      </Segment>
    </>
  ) : (
    <TitleEditor title={post.title} refNo={post._refNo} />
  );
}

export default function PostEditor({
  post,
  inline,
  extras,
  onSubmit,
  onCancel
}) {
  // const { activeIndex, setActiveIndex } = useState(getLastWidgetIndex(post));
  const headerRef = useRef(null);
  const contentRef = useRef(null);
  const actionsRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [contentMaxHeight, setContentMaxHeight] = useState(null);
  const { windowSize, contentStyle } = useContext(LayoutContext.Context);
  function handleOnScreen(e, { calculations }) {
    if (
      calculations.height === size.height &&
      calculations.width === size.width
    )
      return;
    setSize({ width: calculations.width, height: calculations.height });
  }
  console.log("renderall");

  const isReply = !!post.parentPostRefNo;
  const contentEditorSize = { width: size.width };
  const pageContentHeight = windowSize.height - contentStyle.paddingTop;
  if (pageContentHeight < 150) {
    // contentEditorSize.height = pageContentHeight - 150 - size.height;
  }

  const hasContent = get(post, "widgets", []).length > 0;
  const modalStyle = {};
  if (hasContent) {
    // modalStyle.bottom = 0;
    // modalStyle.borderBottomLeftRadius = 0;
    // modalStyle.borderBottomRightRadius = 0;
  }

  useEffect(
    () => {
      //   console.log("headerRef", headerRef); //TRACE
      const parentNode = get(contentRef, "current.parentNode");
      if (parentNode) {
        parentNode.classList.remove("content");
      }
    },
    [contentRef]
  );

  useEffect(
    () => {
      const parentNode = get(actionsRef, "current.parentNode");
      if (parentNode) {
        parentNode.classList.remove("actions");
      }
    },
    [actionsRef]
  );

  useEffect(
    () => {
      const parentNode = get(headerRef, "current.parentNode");
      if (parentNode) {
        parentNode.classList.remove("header");
      }
    },
    [headerRef]
  );

  return (
    <div>
      <Modal
        className="post-editor-modal"
        open
        style={modalStyle}
        // centered={false}
      >
        <Modal.Header>
          <div ref={headerRef}>
            <PostHeader post={post} />
          </div>
        </Modal.Header>
        <Modal.Content
          image
          scrolling
          className="post-editor-content"
          style={{ maxHeight: contentMaxHeight }}
        >
          <div ref={contentRef} style={{ width: "100%" }}>
            <ContentList post={post} />
          </div>
        </Modal.Content>
        <Modal.Actions style={{ textAlign: "inherit" }}>
          <div ref={actionsRef} style={{ width: "100%" }}>
            <PostActions post={post} onSubmit={onSubmit} onCancel={onCancel} />
            {extras}
            <ContentEditorWrapper
              post={post}
              inline={inline}
              contentEditorSize={contentEditorSize}
            />
          </div>
        </Modal.Actions>
      </Modal>
    </div>
  );
}
