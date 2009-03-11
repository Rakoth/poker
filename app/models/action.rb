class Action < ActiveRecord::Base
  
  belongs_to :game
  belongs_to :player

  NAME_BY_KIND = [:pass, :check, :call, :bet, :raise]
  
  named_scope :omitted, lambda { |game_id, last_id|
    {:conditions => ["game_id = ? AND id > ?", game_id, last_id]} }

  def has_value?
    this.kind >= 3
  end

  def time_handler 
    this.game.type.action_time - (Time.now - this.created_at).to_i
  end

end
