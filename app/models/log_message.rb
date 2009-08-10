class LogMessage < ActiveRecord::Base
  belongs_to :player
  belongs_to :game

	attr_protected :id, :created_at

	named_scope :omitted, lambda{ |game_id, last_id, player_id|
		{
			:conditions => ["game_id = ? AND id > ? AND player_id <> ?", game_id, last_id, player_id],
			:order => 'created_at'
		}
	}
end
