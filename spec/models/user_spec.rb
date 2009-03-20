require File.dirname(__FILE__) + '/../spec_helper'

context "User class with fixtures loaded" do
  fixtures :users

  specify "should count two Users" do
    User.count.should_be 2
  end

  specify "should have more specifications" do
    violated "not enough specs"
  end
end
