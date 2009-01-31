class Game < ActiveRecord::Base
  belongs_to :kind, :class_name => 'GameType', :foreign_key => 'type_id'
  has_many :players
  has_many :users, :through => :players

  def verify_level level
    level >= kind.min_level and level <= kind.max_level
  end

  def add_player user
    player = players.create(
      :user => user,
      :sit => players_count,
      :stack => kind.start_stack
    ) if wait? and verify_level(user.level)
    if player
      max_players = kind.max_players
      self.reload
      update_attribute(:status, 'start') if players_count == max_players
    end
    player
  end

  def wait?
    'wait' == status
  end

  def change_status_time
    self[:change_status_time] or Time.now
  end
  
end
