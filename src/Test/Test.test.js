import React from 'react';
import { shallow } from 'enzyme';
import Test from './Test';

describe('<Test />', () => {
  test('renders', () => {
    const wrapper = shallow(<Test />);
    expect(wrapper).toMatchSnapshot();
  });
});
