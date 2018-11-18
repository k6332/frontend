import React, {
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect
} from "react";
import "./IconScroller.css";
import Button from "antd/lib/button";
import Icon from "antd/lib/icon";
import PostStackContext from "../../contexts/PostStackContext";
import { useWindowScrollPosition } from "the-platform";
import get from "lodash/get";
import forEach from "lodash/forEach";
import LayoutContext from "../../contexts/LayoutContext";

// const ICON_HEIGHT = 24;
const EDGE_OFFSET = 100;
const BUTTON_OFFSET_Y = 35;
const BUTTON_OFFSET_X = 18;
function Edges({ edges }) {
  const defaultEdgeStyle = {
    borderLeftColor: "gainsboro",
    borderLeftStyle: "solid",
    top: 0,
    bottom: 0
  };
  return (
    <>
      <div className="edge" style={defaultEdgeStyle} />
      {edges.map((edge, ii) => {
        let edgeY = edge.offsetY;
        let tailEdgeY = edge.tailOffsetY;
        const headVisible = edgeY + EDGE_OFFSET > 0;
        const border = {
          borderLeftColor: "blue",
          borderLeftStyle: "solid"
        };
        console.log("edge"); //TRACE
        console.log(edge); //TRACE
        // if (edge)
        // const nextEdge = get(edges, [ii + 1]);
        // if (nextEdge) {
        //   console.log("nextEdge"); //TRACE
        //   console.log(edge, nextEdge); //TRACE
        //   if (nextEdge.parentRefNo === edge.refNo) {
        //     border.borderLeftColor = "darkblue";
        //     border.borderLeftStyle = "solid";
        //   } else if (nextEdge.parentRefNo === edge.parentRefNo) {
        //     border.borderLeftColor = "gainsboro";
        //     border.borderLeftStyle = "solid";
        //   }
        // }
        return (
          <div
            key={edge.id}
            className="edge"
            style={{
              height: headVisible ? tailEdgeY - edgeY : tailEdgeY + EDGE_OFFSET,
              top: headVisible ? edgeY + EDGE_OFFSET : 0,
              ...border
            }}
          />
        );
      })}
    </>
  );
}

export default function IconScroller({ height, width }) {
  const { postStack } = useContext(PostStackContext.Context);
  const { contentStyle } = useContext(LayoutContext.Context);
  const ctrlRef = useRef(null);
  const [edges, setEdges] = useState([]);
  const { y: scrollY } = useWindowScrollPosition();

  const ctrlOffsetY = contentStyle.paddingTop;
  useEffect(() => {
    let newEdges = [];
    postStack.forEach(postObj => {
      const curEl = get(postObj, "headEl.current");
      if (!curEl) return;
      const { y: offsetTop } = curEl.getBoundingClientRect();
      let tailOffsetY;
      const tailEl = get(postObj, "tailEl.current");
      if (tailEl) {
        const { y: tailOffsetTop } = tailEl.getBoundingClientRect();
        tailOffsetY = tailOffsetTop - contentStyle.paddingTop;
      }
      offsetTop &&
        newEdges.push({
          id: postObj.id,
          refNo: postObj.post._refNo,
          parentRefNo: postObj.post.parentPostRefNo,
          offsetY: offsetTop - contentStyle.paddingTop,
          tailOffsetY
        });
    });
    newEdges = newEdges.sort((e1, e2) => e1.offsetY - e2.offsetY);
    setEdges(newEdges);
  });
  return (
    <div ref={ctrlRef} className="icon-scroller" style={{ height, width }}>
      {/* <Edges edges={edges} /> */}
      {edges.map((edge, i) => {
        let iconTop = EDGE_OFFSET + edge.offsetY;
        if (iconTop < ctrlOffsetY) {
          const displayStyle = { width };
          displayStyle.top = ctrlOffsetY;
          displayStyle.marginTop = BUTTON_OFFSET_Y * i;
          displayStyle.marginLeft = BUTTON_OFFSET_X * i;
          // const isLast = i === edges.length - 1;
          const isLast = true;
          return (
            <div key={edge.id} className="reply-head" style={displayStyle}>
              <Button
                type={isLast ? "primary" : "dashed"}
                className="icon-button"
                title={edge.id}
                onClick={() => {
                  window.scrollTo({
                    top: scrollY - EDGE_OFFSET + edge.offsetY,
                    behavior: "smooth"
                  });
                }}
              >
                <Icon type="up-circle" theme="outlined" />
              </Button>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
