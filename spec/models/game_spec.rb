require File.expand_path(File.dirname(__FILE__) + '/../spec_helper')

describe Game do
  before(:each) do
    @game = Game.new
  end

  it "should be in 'wait' status after creation" do
    @game.should be_wait
  end

  it "should " do

  end
end
