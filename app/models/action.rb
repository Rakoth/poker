class Action < ActiveRecord::Base
  
  belongs_to :game
  belongs_to :player

  NAME_BY_KIND = [:pass, :check, :call, :bet, :raise]
  
  named_scope :omitted, lambda { |game_id, last_id|
    {:conditions => ["game_id = ? AND id > ?", game_id, last_id]} }

  def has_value?
    self.kind >= 3
  end

  def time_handler 
    self.game.type.action_time - (Time.now - self.created_at).to_i
  end

end
