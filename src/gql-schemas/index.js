import gql from "graphql-tag";

export * from "./FollowPost";
export * from "./ReportPost";
export * from "./RemovePost";
export * from "./PostList";
export * from "./GetPost";
export * from "./Post";
export * from "./LastDraft";
export * from "./PublishPost";
export * from "./UpdatePostWidgets";

export const CREATE_POST = gql`
  mutation($post: CreatePostInput) {
    CreatePost(input: $post) {
      status
      post {
        id
        title
        section
        category
        description
        _refNo
      }
    }
  }
`;

export const EDIT_POST = gql`
  mutation($post: EditPostInput) {
    EditPost(input: $post) {
      status
      post {
        id
        title
        section
        category
        description
        _refNo
      }
    }
  }
`;
