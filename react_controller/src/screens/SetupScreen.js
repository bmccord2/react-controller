import React, {Component} from 'react'
import {Text, TextInput, View, Button} from 'react-native'

export default class SetupScreen extends React.Component {
  static navigationOptions = {
    title: 'Setup',
  }

  constructor(props) {
    super(props)
    this.state = {hostname:'10.0.2.2'}
  }
  render() {
    const { navigate } = this.props.navigation

    return (
        <View>
            <Text>Host Address</Text>
            <TextInput 
                value={this.state.hostname}
                onChangeText={ (hostname) => this.setState({hostname}) } />
            <Button title='Submit' onPress={() => {
                    navigate('Joystick', {
                        'hostname':this.state.hostname
                    })
                }}>
                Submit
            </Button>
        </View>
    )
  }
}