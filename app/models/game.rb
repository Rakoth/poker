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
