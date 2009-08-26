class BlindValue < ActiveRecord::Base
  belongs_to :game_type, :class_name => 'GameTypes::Base'
  validates_presence_of :value, :level, :ante
  validates_numericality_of :value, :level, :ante, :greater_than_or_equal_to => 0
end
