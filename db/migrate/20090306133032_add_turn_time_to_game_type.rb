class AddTurnTimeToGameType < ActiveRecord::Migration
  def self.up
    add_column :game_types, :turn_time, :integer
  end

  def self.down
    remove_column :game_types, :turn_time
  end
end
