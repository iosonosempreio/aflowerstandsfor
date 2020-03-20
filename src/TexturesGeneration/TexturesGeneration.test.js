import React from 'react';
import { shallow } from 'enzyme';
import TexturesGeneration from './TexturesGeneration';

describe('<TexturesGeneration />', () => {
  test('renders', () => {
    const wrapper = shallow(<TexturesGeneration />);
    expect(wrapper).toMatchSnapshot();
  });
});
