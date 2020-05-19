import React from 'react';
import { shallow } from 'enzyme';
import Meadow from './Meadow';

describe('<Meadow />', () => {
  test('renders', () => {
    const wrapper = shallow(<Meadow />);
    expect(wrapper).toMatchSnapshot();
  });
});
