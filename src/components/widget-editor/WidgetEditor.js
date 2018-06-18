import React, { Component } from 'react'
import { manifests } from './../../components/widgets';
import {
    Dropdown,
    Segment,
    Message,
    Button,
    Divider
} from 'semantic-ui-react'
import PropsEditor from 'react-props-editor'
import WidgetContext from '../../contexts/WidgetContext';
import PostViewContext from '../../contexts/PostViewContext';
import ResponsiveContext from '../../contexts/Responsive';
import { debuglog } from 'util';

const WIDGET_OPTS = [];
Object.keys(manifests).forEach(wKey => {
    const widgetInfo = manifests[wKey]
    if(widgetInfo.disabled) return;
    WIDGET_OPTS.push({
        text: wKey,
        value: wKey,
        icon: widgetInfo.icon || 'plus'
    })
})

export default class WidgetEditor extends Component {
    state = {
    }

    render() {
        const { widgetName, widgetProps = {}, added } = this.state;
        const { onChange } = this.props;
        let WidgetPreview;
        if (widgetName) {
            WidgetPreview = manifests[widgetName].component;
        }
        return <WidgetContext.Consumer>
            {({ setCreatingFn, submitNewFn, submitting }) => {
                const resetComponent = async () => {
                    await setCreatingFn(false)
                    this.setState({
                        widgetName: undefined,
                        widgetProps: undefined,
                        added: undefined
                    })
                }
                if (added) {
                    return <Message
                        success
                    >
                        <Message.Header>
                            <Button floated='right' content='Close' onClick={() => {
                                resetComponent();
                            }} />
                            <div>Widget has been added</div>
                        </Message.Header>
                        Please scroll down to configure its position
                    </Message>
                }
                return (
                    <ResponsiveContext.Consumer>
                        {({ isMobile }) => (
                            <div>
                                Name: <Dropdown placeholder='Select Widget' fluid search
                                    selection options={WIDGET_OPTS}
                                    onChange={(_, data) => {
                                        this.setState({ widgetName: data.value })
                                        onChange && onChange({
                                            name: widgetName
                                        })
                                    }}
                                />
                                {WidgetPreview && <React.Fragment>
                                    Fields: <Segment>
                                        <PropsEditor 
                                            propObjects={manifests[widgetName].propObjects}
                                            onChange={(data) => {
                                                this.setState({widgetProps:data})
                                                onChange && onChange({
                                                    name: widgetName,
                                                    ...widgetProps
                                                })
                                            }} />
                                    </Segment>
                                    Preview: <div>
                                        <Segment>
                                            <WidgetPreview {...widgetProps.propValues} />
                                        </Segment>
                                    </div>
                                </React.Fragment>}
                            </div>
                        )}
                    </ResponsiveContext.Consumer>)
            }}
        </WidgetContext.Consumer>
    }
}