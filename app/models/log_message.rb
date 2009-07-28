class LogMessage < ActiveRecord::Base
  belongs_to :user
  belongs_to :game

	attr_protected :id, :created_at

	named_scope :omitted, lambda{ |game_id, last_id, user_id|
		{
			:conditions => ["game_id = ? AND id > ? AND user_id <> ?", game_id, last_id, user_id],
			:order => 'created_at',
			:include => :user
		}
	}

#	def build_synch_data
#		{
#			:id => id,
#			:login => user.login,
#			:text => text
#		}
#	end
end
