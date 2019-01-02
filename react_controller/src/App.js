/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import {createStackNavigator} from 'react-navigation'
import screens from './screens'

const App = createStackNavigator({
  Setup: screens.SetupScreen,
  Joystick: screens.JoystickScreen,
}, {
  'headerMode': 'none',
  'initialRouteName': 'Setup'
})

export default App
