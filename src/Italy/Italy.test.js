import React from 'react';
import { shallow } from 'enzyme';
import Italy from './Italy';

describe('<Italy />', () => {
  test('renders', () => {
    const wrapper = shallow(<Italy />);
    expect(wrapper).toMatchSnapshot();
  });
});
