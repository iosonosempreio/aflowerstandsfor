import React from 'react';
import { shallow } from 'enzyme';
import PixiViz from './PixiViz';

describe('<PixiViz />', () => {
  test('renders', () => {
    const wrapper = shallow(<PixiViz />);
    expect(wrapper).toMatchSnapshot();
  });
});
