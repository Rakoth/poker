class PlayerActions::Action < ActiveRecord::Base
  
  belongs_to :game
  belongs_to :player

  before_save :perform!
	before_destroy :mark_as_deleted!
  
  named_scope :omitted, lambda{ |game_id, last_id, player_id|
		{:conditions => ["game_id = ? AND id > ? AND (player_id <> ? OR type IN ('AutoFoldAction', 'AutoCheckAction', 'TimeoutFoldAction', 'TimeoutCheckAction')) ", game_id, last_id, player_id]}
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
    @game_params = {}
  end

  def execute
    save! if can_perform?
  end

  protected

  def can_perform?
    true
  end

  def perform!
    game_influence
    player_influence
		game.goto_next_stage
  end

  def game_influence
    game.update_attributes!(@game_params) unless @game_params.empty?
  end

  def player_influence
  end

	def mark_as_deleted!
		update_attribute :deleted, true
		return false
	end
end
