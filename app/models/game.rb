class Game < ActiveRecord::Base

  self.inheritance_column = "class"

  belongs_to :type, :class_name => 'GameType'
  has_many :players, :dependent => :delete_all
  has_many :users, :through => :players
  has_many :actions

  def minimal_bet
    blind_value * type.bet_multiplier
  end

  def add_player user
    player = players.create(
      :user => user,
      :sit => players_count,
      :stack => type.start_stack
    ) if wait? and user.can_join?(self)
    if player
      max_players = type.max_players
      self.reload
      start if players_count == max_players
    end
    player
  end

  def wait?
    'wait' == status
  end

  def wait_action_from user
    Player.find_by_id_and_user_id turn, user.id
  end

  def next_level
    if new_blind_size = type.get_blind_size(blind_level + 1)
        update_attributes(
          :blind_level => blind_level + 1,
          :blind_size => new_blind_size.value,
          :ante => new_blind_size.ante,
          :next_level_time => Time.now + type.change_level_time.minutes
        )
    else
      update_attribute(:next_level_time, nil)
    end if next_level_time and Time.now >= next_level_time
  end

  def start
    update_attributes(:status => 'start', :next_level_time => Time.now + type.change_level_time.minutes)
  end
  
end
