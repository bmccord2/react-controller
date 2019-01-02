import React, {Component} from 'react'
import {Text, View, Button, StyleSheet, Dimensions} from 'react-native'
import { TouchEventDemuxer, JoystickDemuxed } from 'joystick-component-lib'
import cloneDeep from 'lodash.clonedeep'
import PropTypes from 'prop-types';

const style = StyleSheet.create({
})

class JoystickButton extends React.Component {
  static propTypes = {
    centerX: PropTypes.number,
    centerY: PropTypes.number,
    radius: PropTypes.number,
    color: PropTypes.string,
    name: PropTypes.string,
    onPressChange: PropTypes.func
  }

  constructor(props) {
    super(props)
  }

  includes(x, y) {
    let radius = this.props.radius
    let xMin = this.props.centerX - radius
    let yMin = this.props.centerY - radius
    let xMax = this.props.centerX + radius
    let yMax = this.props.centerY + radius

    return x > xMin && x < xMax && y > yMin && y < yMax
  }

  onTouchStart(touch) {
    this.handlePressChange(true)
  }

  onTouchEnd(touch) {
    this.handlePressChange(false)
  }

  handlePressChange(pressed) {
    if(this.props.onPressChange) {
      this.props.onPressChange(pressed)
    }
  }

  render() {
    let diameter = this.props.radius * 2
    let buttonStyle =  {
      backgroundColor: this.props.color || 'blue',
      width: diameter,
      height: diameter,
      borderRadius: this.props.radius,
      left: this.props.centerX - this.props.radius,
      top: this.props.centerY - this.props.radius,
      position: 'absolute',
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    }
    let textStyle = {
      fontSize: this.props.radius
    }

    return (
      <View style={buttonStyle}>
        <Text style={textStyle}>{this.props.name || ''}</Text>
      </View>
    )
  }
}

const componentArray = [
  JoystickDemuxed,
  JoystickButton,
  JoystickButton,
  JoystickButton,
  JoystickButton
]

const JoystickComponents = TouchEventDemuxer(componentArray)

export default class JoystickScreen extends React.Component {
  static navigationOptions = {
    title: 'Joystick',
  }

  constructor(props) {
    super(props)
    this.state = {
      controllerId:null,
    }

    this.controllerState = {
      leftPadX: 0,
      leftPadY: 0,
      A: false,
      B: false,
      X: false,
      Y: false
    }

    this.lastControllerState = null
  }

  componentDidMount() {
    this.registerJoyStick()
  }

  componentWillUnmount() {
    this.unregisterJoyStick()
  }

  registerJoyStick(){
    let hostname = this.props.navigation.getParam('hostname')
    let params = this.state.controllerId ? `?id=${this.state.controllerId}` : ''
    fetch(`http://${hostname}:5000/controller${params}`, {
      method: 'GET'
    }).then((response) => response.json())
      .then((responseJson) => {
        this.setState({'controllerId': responseJson.id})
      })
  }

  unregisterJoyStick(){
    let hostname = this.props.navigation.getParam('hostname')
    let id = this.state.controllerId
    fetch(`http://${hostname}:5000/controller?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    })
  }


  publishState() {
    let currentState = cloneDeep(this.controllerState)
    let stateDiff = this.getStateDifference(currentState)

    if (stateDiff) {
      if (this.state.controllerId) {
        let hostname = this.props.navigation.getParam('hostname')
        fetch(`http://${hostname}:5000/controller`, {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            'id': this.state.controllerId,
            'state': stateDiff
          })
        }).then((response) => {
          if (response.status === 200) {
            this.lastControllerState = currentState
          }
        })
      } else {
        console.warn('Controller id does not exist.')
      }
    }
  }

  getStateDifference(currentState) {
    if(this.lastControllerState == null) {
      return currentState
    }
    let diff = {}
    for (prop in currentState) {
      if(currentState[prop] != this.lastControllerState[prop]) {
        diff[prop] = currentState[prop]
      }
    }

    return diff
  }

  buttonPressChange(name, pressed) {
    this.controllerState[name] = pressed
    this.publishState()
  }

  joystickMove(xRatio, yRatio){
    this.controllerState.leftPadX = xRatio
    this.controllerState.leftPadY = yRatio
    this.publishState()
  }

  render() {
    var {height, width} = Dimensions.get('window');

    let joystickOuterRadius = width / 7
    let joystickInnerRadius = width / 10
    let joystickDraggableStyle = {
      width: joystickInnerRadius,
      height: joystickInnerRadius
    }
    let buttonRadius = 50
    let buttonXOffset = buttonRadius * 2.10
    let buttonYOffset = buttonRadius * 2.10
    let centerButtonsX = width - (buttonXOffset + buttonRadius + 10)
    let centerButtonsY = height * 1/2

    return (
      <View>
        <JoystickComponents
          childrenProps={[
            {
              neutralPointX: width / 5,
              neutralPointY: height / 2,
              draggableStyle: joystickDraggableStyle,
              shape: 'circular',
              isSticky: true,
              length: joystickOuterRadius,
              onJoystickMove: (xRatio, yRatio) => this.joystickMove(xRatio, yRatio)
            },
            {
              centerX: centerButtonsX - buttonXOffset,
              centerY: centerButtonsY,
              radius: 50,
              name: 'X',
              color: 'blue',
              onPressChange: (pressed) => this.buttonPressChange('X', pressed)
            },
            {
              centerX: centerButtonsX,
              centerY: centerButtonsY - buttonYOffset,
              radius: 50,
              name: 'Y',
              color: 'yellow',
              onPressChange: (pressed) => this.buttonPressChange('Y', pressed)
            },
            {
              centerX: centerButtonsX + buttonYOffset,
              centerY: centerButtonsY,
              radius: 50,
              name: 'B',
              color: 'red',
              onPressChange: (pressed) => this.buttonPressChange('B', pressed)
            },
            {
              centerX: centerButtonsX,
              centerY: centerButtonsY + buttonYOffset,
              radius: 50,
              name: 'A',
              color: 'green',
              onPressChange: (pressed) => this.buttonPressChange('A', pressed)
            }
          ]}
        />
      </View>
    )
  }
}
