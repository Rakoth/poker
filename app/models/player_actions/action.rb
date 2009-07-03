class PlayerActions::Action < ActiveRecord::Base

	KINDS = {
		:auto_check => -4,
		:timeout_check => -3,
		:auto_fold => -2,
		:timeout_fold => -1,
		:fold => 0,
		:check => 1,
		:call => 2,
		:bet => 3,
		:raise => 4,
	}

	def self.execute_action kind, params = {}
		action = case kind
			when KINDS[:auto_check]
				PlayerActions::AutoCheckAction.new params
			when KINDS[:timeout_check]
				PlayerActions::TimeoutCheckAction.new params
			when KINDS[:auto_fold]
				PlayerActions::AutoFoldAction.new params
			when KINDS[:timeout_fold]
				PlayerActions::TimeoutFoldAction.new params
			when KINDS[:fold]
				PlayerActions::FoldAction.new params
			when KINDS[:check]
				PlayerActions::CheckAction.new params
			when KINDS[:call]
				PlayerActions::CallAction.new params
			when KINDS[:bet]
				PlayerActions::BetAction.new params
			when KINDS[:raise]
				PlayerActions::RaiseAction.new params
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

	KIND = nil

  def kind
    self.class::KIND
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
