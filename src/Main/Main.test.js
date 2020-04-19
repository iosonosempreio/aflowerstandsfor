import React from 'react';
import { shallow } from 'enzyme';
import Main from './Main';

describe('<Main />', () => {
  test('renders', () => {
    const wrapper = shallow(<Main />);
    expect(wrapper).toMatchSnapshot();
  });
});
