import React from 'react';
import { shallow } from 'enzyme';
import VizView from './VizView';

describe('<VizView />', () => {
  test('renders', () => {
    const wrapper = shallow(<VizView />);
    expect(wrapper).toMatchSnapshot();
  });
});
