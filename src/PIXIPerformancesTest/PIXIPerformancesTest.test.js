import React from 'react';
import { shallow } from 'enzyme';
import PIXIPerformancesTest from './PIXIPerformancesTest';

describe('<PIXIPerformancesTest />', () => {
  test('renders', () => {
    const wrapper = shallow(<PIXIPerformancesTest />);
    expect(wrapper).toMatchSnapshot();
  });
});
