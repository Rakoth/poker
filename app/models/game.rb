class Game < ActiveRecord::Base
  self.inheritance_column = "class"
  belongs_to :type, :class_name => 'GameType'
  has_many :players, :dependent => :delete_all
  has_many :users, :through => :players

  def add_player user
    player = players.create(
      :user => user,
      :sit => players_count,
      :stack => type.start_stack
    ) if wait? and type.verify_level(user.level)
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

  def next_level
    if next_level_time and Time.now >= next_level_time
      if new_blind_size = type.get_blind_size(level + 1)
        update_attributes(
          :level => level + 1,
          :blind_size => new_blind_size.value,
          :ante => new_blind_size.ante,
          :next_level_time => Time.now + type.change_level_time.minutes
        )
      else
        update_attribute(:next_level_time, nil)
      end
    end
  end

  def start
    update_attributes(:status => 'start', :next_level_time => Time.now + type.change_level_time.minutes)
  end
  
end
