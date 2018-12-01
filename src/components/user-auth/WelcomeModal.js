import React from 'react';
// import PropTypes from 'prop-types';
import { Button, Modal, Divider, Image, Header } from 'semantic-ui-react';
// import _ from 'lodash'
import { Query, Mutation } from 'react-apollo';
import gql from 'graphql-tag';
// import Cookie from 'tough-cookie'
import LoginContext from './LoginContext';
import { GetUserInfo } from './../../gql-schemas/GetUserInfo';
// import UsernameInput from "./../user-info/UsernameInput";
import get from 'lodash/get';

export const PHOTO_DATA_URI_KEY = 'photoDataUri';

const LOGIN = gql`
  mutation($creds: UserAuthLoginInput) {
    UserAuthLogin(input: $creds) {
      status
      cookie
    }
  }
`;

const ContinueButton = ({ enabled, credential, doLogin, refetch }) => (
  <Mutation
    mutation={LOGIN}
    variables={{
      creds: {
        accessToken: credential.accessToken,
        provider: credential.providerId
      }
    }}
    onCompleted={data => {
      doLogin(data);
      refetch();
    }}
  >
    {(auth, { loading, error, data }) => {
      if (data) {
        return <div>Done!</div>;
      }
      return (
        <Button disabled={!enabled} loading={loading} color="green" onClick={auth}>
          Continue
        </Button>
      );
    }}
  </Mutation>
);

export default class WelcomeModal extends React.Component {
  state = {};
  render() {
    const { refetch } = this.props;
    return (
      <LoginContext.Consumer>
        {({ authDetail, doLogin }) => {
          if (!authDetail) return;

          const { user, credential } = authDetail;
          const photoDataUri = localStorage.getItem(PHOTO_DATA_URI_KEY);
          return (
            <Query
              query={GetUserInfo.query}
              variables={{
                accessToken: credential.accessToken,
                providerId: credential.providerId,
                email: user.email
              }}
            >
              {({ data, loading }) => {
                const userData = get(data, 'UserInfo.user');
                console.log('userData', userData); //TRACE
                const newUser = get(userData, 'id') < 0;
                return (
                  <Modal open={true} size="mini">
                    <Header as="h3" image>
                      <center>
                        <Image src={get(userData, 'photoUrl') || photoDataUri} size="tiny" circular />
                        {newUser ? user.email : get(userData, 'displayName')}
                      </center>
                    </Header>
                    <Modal.Content>
                      <center>
                        <div>
                          {loading && <p>Checking Login..</p>}
                          {!loading && (
                            <p>
                              Welcome <b>{user.displayName || user.email}</b>!
                            </p>
                          )}
                          <Divider />
                          <ContinueButton
                            {...{
                              enabled: !loading,
                              credential,
                              doLogin,
                              refetch
                            }}
                          />
                        </div>
                      </center>
                    </Modal.Content>
                  </Modal>
                );
              }}
            </Query>
          );
        }}
      </LoginContext.Consumer>
    );
  }
}
