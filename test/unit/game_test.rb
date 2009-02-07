require File.dirname(__FILE__) + '/../test_helper'

class GameTest < ActiveSupport::TestCase

  fixtures :games, :game_types, :blind_values, :users

  test "method add_player should create player if user can join the game" do
    game = games(:wait)
    user = users(:reach)
    game.type = game_types(:one)
    game.save!
    assert_difference 'game.players.count' do
      game.add_player user
    end
  end

  test "method add_player should not create player if user cant join the game" do
    game = games(:wait)
    user = users(:poor)
    game.type = game_types(:one)
    game.save!
    assert_no_difference 'game.players.count' do
      game.add_player user
    end
  end

  test "method add_player should not create player if game was started" do
    game = games(:start)
    user = users(:reach)
    game.type = game_types(:one)
    assert_no_difference 'game.players.count' do
      game.add_player user
    end
  end

  test "method add_player should start the game if this is last player" do
    game = games(:pre_start)
    user = users(:reach)
    game.type = game_types(:one)
    game.save!
    game.add_player user
    assert_equal 'start', game.status
  end

  test "method next_level should do nothing if game in wait status" do
    game = games(:wait)
    assert_no_difference 'game.blind_level' do
      game.next_level
    end
  end

  test "method next_level should change blind level and next level time if game in start status and its time" do
    game = games(:start)
    type = game_types(:one)
    game.next_level_time = Time.now
    game.type = type
    assert_difference 'game.blind_level' do
      game.next_level
    end
    assert_in_delta Time.now + type.change_level_time.minutes, game.next_level_time, 1, "time to next level should be set"
  end

  test "method next_level should do nothing if start and its not time" do
    game = games(:start)
    game.next_level_time = Time.now + 10.minutes
    assert_no_difference 'game.blind_level' do
      game.next_level
    end
  end

  test "method next_level should set next_level_time to nil if blind_level is max" do
    game = games(:max_level)
    game.next_level_time = Time.now
    assert_no_difference 'game.blind_level' do
      game.next_level
    end
    assert_nil game.next_level_time, "no more levels"
  end

end
