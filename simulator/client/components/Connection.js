import React, { Component, useEffect } from "react";

import {
    Link,
    withRouter,
} from "react-router-dom";

import fs from 'flatstore';

import { connect } from '../actions/websocket'
import { attachToFrame, detachFromFrame } from "../actions/gamepanel";

function Connection(props) {

    useEffect(() => {
        connect();
        attachToFrame();

        return () => { detachFromFrame() }
    }, [])

    return (
        <></>
    )
}

export default Connection;