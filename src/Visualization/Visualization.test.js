import React from 'react';
import { shallow } from 'enzyme';
import Visualization from './Visualization';

describe('<Visualization />', () => {
  test('renders', () => {
    const wrapper = shallow(<Visualization />);
    expect(wrapper).toMatchSnapshot();
  });
});
