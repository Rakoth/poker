require File.expand_path(File.dirname(__FILE__) + '/../spec_helper')

describe User do
  before(:each) do
    @valid_attributes = {
      :login => 'reach',
      :password => 'sdfgsdfg',
      :password_confirmation => 'sdfgsdfg',
      :email => 'reach@mail.ru',
      :cash => 1000,
      :level => 1
    }
  end

  it "should create a new instance given valid attributes" do
    @user = User.new(@valid_attributes)
    @user.login = @valid_attributes[:login]
    @user.email = @valid_attributes[:email]
  end
end
