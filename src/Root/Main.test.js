import React from 'react';
import { shallow } from 'enzyme';
import Root from './Root';

describe('<Root />', () => {
  test('renders', () => {
    const wrapper = shallow(<Root />);
    expect(wrapper).toMatchSnapshot();
  });
});
