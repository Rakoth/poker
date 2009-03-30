class Action < ActiveRecord::Base
  
  belongs_to :game
  belongs_to :player

  before_save :perform!
  
  named_scope :omitted, lambda{ |game_id, last_id| {:conditions => ["game_id = ? AND id > ?", game_id, last_id]}}

  def has_value?
    kind >= 3
  end

  def time_handler
    self.game.type.action_time - (Time.now - created_at).to_i
  end

  attr_accessor :game_params

  def kind
    raise "can't resive kind of class Action"
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
		game.next_active_player_id
  end

  def game_influence
    game.update_attributes!(@game_params) unless @game_params.empty?
  end

  def player_influence
  end
end
