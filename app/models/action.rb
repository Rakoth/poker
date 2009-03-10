class Action < ActiveRecord::Base
  self.inheritance_column = "class"
#  attr_accessor :type
  belongs_to :game
  belongs_to :player
  
  named_scope :fit, lambda { |game_id, last_id|
    {:conditions => ["game_id = ? AND id > ?", game_id, last_id]} }

  def has_value?
    this.kind >= 3
  end
  
  def self.time_handler action
    return (action.game.type.turn_time - (Time.now - action.created_at).to_i)
  end

end
