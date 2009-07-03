class PlayerActions::Action < ActiveRecord::Base

	AUTO_CHECK = -4
	TIMEOUT_CHECK = -3
	AUTO_FOLD = -2
	TIMEOUT_FOLD = -1
	FOLD = 0
	CHECK = 1
	CALL = 2
	BET = 3
	RAISE = 4
	
	def self.execute_player_action kind, params = {}
		action = case kind
		when FOLD
			PlayerActions::FoldAction.new params
		when CHECK
			PlayerActions::CheckAction.new params
		when CALL
			PlayerActions::CallAction.new params
		when BET
			PlayerActions::BetAction.new params
		when RAISE
			PlayerActions::RaiseAction.new params
		else
			raise 'Unexpected action type in Action#execute_action: "' + kind + '"'
		end
		action.execute
	end

	def self.execute_auto_action kind, params = {}
		action = case kind
		when AUTO_CHECK
			PlayerActions::AutoCheckAction.new params
		when TIMEOUT_CHECK
			PlayerActions::TimeoutCheckAction.new params
		when AUTO_FOLD
			PlayerActions::AutoFoldAction.new params
		when TIMEOUT_FOLD
			PlayerActions::TimeoutFoldAction.new params
		else
			raise 'Unexpected action type in Action#execute_action: "' + kind + '"'
		end
		action.execute
	end

	belongs_to :game
  belongs_to :player

  before_create :player_has_acted!, :perform!
	after_create :pause_game!, :if => :need_pause?
	after_create :proceed_distribution
	before_destroy :mark_as_deleted!
  
  named_scope :omitted, lambda{ |game_id, last_id, player_id|
		{
			:conditions => ["game_id = ? AND id > ? AND (player_id <> ? OR type IN ('AutoFoldAction', 'AutoCheckAction', 'TimeoutFoldAction', 'TimeoutCheckAction')) ", game_id, last_id, player_id],
			:order => 'created_at'
		}
	}

  def has_value?
    false
  end

  def time_left
    self.game.type.time_for_action - (Time.now - created_at).to_i
  end

  attr_accessor :game_params

  def kind
  end

  def value
    self[:value] ||= 0
  end

  def after_initialize
    self.game_params = {}
  end

  def execute
    save if can_perform?
  end

  protected

  def can_perform?
    true
  end

  def perform!
    player_influence
		game_influence
		#game.goto_next_stage
  end

  def game_influence
    game.update_attributes!(game_params) unless game_params.empty?
  end

  def player_influence
  end

	def mark_as_deleted!
		update_attribute :deleted, true
		return false
	end

	def player_has_acted!
		player.has_acted!
	end

	def need_pause?
		game.all_away?
	end

	def pause_game!
		game.pause_by_away!
	end

	def proceed_distribution
		if game.final_distribution?
			game.final_distribution!
		else
			game.continue_distribution!
		end
	end
end
