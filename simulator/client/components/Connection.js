import React, { Component, useEffect } from "react";

import {
    Link,
    withRouter,
} from "react-router-dom";

import fs from 'flatstore';
import GamePanelService from "../services/GamePanelService";

// import { connect } from '../actions/websocket'

function Connection(props) {

    useEffect(() => {
        // connect();
        // GamePanelService.attachToFrame();
        // attachToFrame();

        // return () => { detachFromFrame() }
    }, [])

    return (
        <></>
    )
}

export default Connection;